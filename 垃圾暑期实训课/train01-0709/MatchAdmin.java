/*5.MatchAdmin赛事管理员（继承抽象类+实现Operate接口）
拥有接口全部管理功能，额外支持查看系统全部对局记录。 */

/*继承AbstractPlayer并实现Operate接口，必须重写所有接口方法 */
public class MatchAdmin extends AbstractPlayer implements Operate {

    public MatchAdmin(int id, String name, int age) {
        super(id, name, age);
    }

    @Override
    public void showInfo() {
        System.out.println("赛事管理员信息:");
        printBasicInfo();
        System.out.println("身份: 赛事管理员");
    }

    @Override

    /*创建比赛对局的方法 */
    public void createMatch(int teamAId, int teamBId, String result) {
        Team teamA = null;
        Team teamB = null;
        for (Team team : Main.teams) {
            if (team.getId() == teamAId) {
                teamA = team;
            }
            if (team.getId() == teamBId) {
                teamB = team;
            }
        }

        if (teamA == null) {
            System.out.println("错误: 战队A不存在！");
            return;
        }
        if (teamB == null) {
            System.out.println("错误: 战队B不存在！");
            return;
        }
        if (teamAId == teamBId) {
            System.out.println("错误: 同一战队不能对战！");
            return;
        }

        int scoreA = 0;
        int scoreB = 0;
        String gameResult = "";
        /*equalsIgnoreCase忽略大小写 */
        if (result.equalsIgnoreCase("A")) {
            scoreA = 3;
            gameResult = "A胜";
        } else if (result.equalsIgnoreCase("B")) {
            scoreB = 3;
            gameResult = "B胜";
        } else if (result.equalsIgnoreCase("P")) {
            scoreA = 1;
            scoreB = 1;
            gameResult = "平局";
        } else {
            System.out.println("错误: 无效的比赛结果！请输入 A/B/P");
            return;
        }

        teamA.addScore(scoreA);
        teamB.addScore(scoreB);
        int matchId = Main.matchRecords.size() + 1;
        MatchRecord record = new MatchRecord(
            matchId,
            teamAId,
            teamBId,
            scoreA,
            scoreB,
            gameResult
        );
        Main.matchRecords.put(matchId, record);
        System.out.println("成功创建对局！");
        record.showRecord();
    }

    @Override
    public void statScoreByGame() {
        System.out.println("按游戏分类统计积分:");
        for (String game : Main.gameTypes) {
            System.out.println("\n【" + game + "】");
            int totalScore = 0;
            for (Team team : Main.teams) {
                if (team.getGame().equals(game)) {
                    System.out.println(
                        "  战队: " +
                            team.getName() +
                            " | 积分: " +
                            team.getScore()
                    );
                    totalScore += team.getScore();
                }
            }
            System.out.println("  该游戏总积分: " + totalScore);
        }
    }

    @Override
    public void blacklistPlayer(int playerId) {
        AbstractPlayer player = null;
        for (AbstractPlayer p : Main.players) {
            if (p.getId() == playerId) {
                player = p;
                break;
            }
        }
        if (player == null) {
            System.out.println("错误: 选手不存在！");
            return;
        }
        if (player instanceof MatchAdmin) {
            System.out.println("错误: 不能拉黑管理员！");
            return;
        }
        player.setBanned(!player.isBanned());
        System.out.println(
            "操作成功！选手 " +
                player.getName() +
                " 黑名单状态: " +
                (player.isBanned() ? "已拉黑" : "已解除")
        );
    }

    public void queryAllMatches() {
        System.out.println("系统全部对局记录");
        if (Main.matchRecords.isEmpty()) {
            System.out.println("暂无对局记录！");
            return;
        }
        for (MatchRecord record : Main.matchRecords.values()) {
            record.showRecord();
        }
    }
}
